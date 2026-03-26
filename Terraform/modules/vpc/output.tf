output "vpc_id" {
 value = aws_vpc.vpc.id 
 description = "Application Vpc ID"
}

output "private_subnet_ids"{
 value = aws_subnet.private_subnet[*].id
 description = "Private Subnets ID"
}

output "public_subnet_ids" {
  value = aws_subnet.private_subnet[*].id
  description = "Public Subnets ID"
}

output "igw"{
    value =  aws_internet_gateway.IGW.id
    description = "Application Internet gateway ID"
}

output "nat_gateway_id" {
  value = aws_nat_gateway.nat_igw.id
  description = "Application NAT-GATEWAY ID"
}

output "public_route_table_id"{
    value = aws_route_table.public_route_table.id
    description = "Public Route Table ID"
}

output "private_route_table_id" {
   value = aws_route_table.private_route_table.id 
   description = "Private Route Table ID"
}

output "availability_zones" {
  description = "Availability Zones used in the VPC"
  value       = data.aws_availability_zones.available.names
}
